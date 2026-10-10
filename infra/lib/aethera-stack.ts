import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as sfn_tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as logs from 'aws-cdk-lib/aws-logs';

export class AetheraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. S3 Storage for Environmental Ingestion Cache (Server-side Encrypted, Public Blocked)
    const dataBucket = new s3.Bucket(this, 'SaansSaathiDataBucket', {
      bucketName: cdk.PhysicalName.GENERATE_IF_NEEDED,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'ExpireOldTelemetry',
          expiration: cdk.Duration.days(14), // Cost control: purge old files
        },
      ],
    });

    // 2. DynamoDB Table for Alert Ladder Records (Pay-per-request: Zero Idle Cost)
    const alertTable = new dynamodb.Table(this, 'AlertRecordsTable', {
      partitionKey: { name: 'eventId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 3. DynamoDB Table for Agent Decision Auditing
    const decisionsTable = new dynamodb.Table(this, 'DecisionsAuditTable', {
      partitionKey: { name: 'decisionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 4. Amazon SNS Topic for Caregiver Escalations
    const alertTopic = new sns.Topic(this, 'CaregiverAlertTopic', {
      displayName: 'Saans Saathi Caregiver Alerts',
    });

    // 5. CloudWatch Log Group with 14-day Retention (Cost Control)
    const logGroup = new logs.LogGroup(this, 'AlertLadderLogs', {
      logGroupName: '/aws/vendedlogs/states/SaansSaathi-AlertLadder',
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 6. Step Functions Alert Ladder State Machine
    const passNudge = new stepfunctions.Pass(this, 'LocalNudgeUser', {
      comment: 'Stage 1: Deliver calm on-device guidance in Hindi/English',
    });

    const waitPrompt = new stepfunctions.Wait(this, 'WaitForUserCheckin', {
      time: stepfunctions.WaitTime.duration(cdk.Duration.seconds(120)),
    });

    const notifyCaregiver = new sfn_tasks.SnsPublish(this, 'DispatchCaregiverAlert', {
      topic: alertTopic,
      message: stepfunctions.TaskInput.fromText('Maa breathing alert: Severe outdoor AQI spike. Please call Maa.'),
      subject: 'Saans Saathi Priority Alert',
    });

    const waitEmergency = new stepfunctions.Wait(this, 'EmergencyEscalationWindow', {
      time: stepfunctions.WaitTime.duration(cdk.Duration.seconds(180)),
    });

    const notifyEmergency = new sfn_tasks.SnsPublish(this, 'DispatchEmergencySos', {
      topic: alertTopic,
      message: stepfunctions.TaskInput.fromText('EMERGENCY SOS: No caregiver response. Coarse location shared under Cedar policy.'),
      subject: 'URGENT: Saans Saathi SOS Dispatch',
    });

    const ladderDefinition = passNudge
      .next(waitPrompt)
      .next(notifyCaregiver)
      .next(waitEmergency)
      .next(notifyEmergency);

    const stateMachine = new stepfunctions.StateMachine(this, 'AlertLadderStateMachine', {
      stateMachineName: 'SaansSaathi-AlertLadder',
      definitionBody: stepfunctions.DefinitionBody.fromChainable(ladderDefinition),
      logs: {
        destination: logGroup,
        level: stepfunctions.LogLevel.ALL,
      },
      timeout: cdk.Duration.minutes(15),
    });

    // 7. Least-privilege IAM Policy for Amazon Bedrock Foundation Models
    const bedrockPolicy = new iam.PolicyStatement({
      actions: [
        'bedrock:InvokeModel',
        'bedrock:Converse',
        'bedrock:ListFoundationModels',
      ],
      resources: ['*'],
    });

    // Stack Outputs
    new cdk.CfnOutput(this, 'DataBucketName', {
      value: dataBucket.bucketName,
      description: 'S3 Ingestion Cache Bucket',
    });

    new cdk.CfnOutput(this, 'AlertTableName', {
      value: alertTable.tableName,
      description: 'DynamoDB Alert Records Table',
    });

    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: stateMachine.stateMachineArn,
      description: 'Step Functions Alert Ladder ARN',
    });

    new cdk.CfnOutput(this, 'SnsTopicArn', {
      value: alertTopic.topicArn,
      description: 'Caregiver SNS Topic ARN',
    });
  }
}
