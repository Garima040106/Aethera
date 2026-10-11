import * as path from 'node:path'
import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2'
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'

export interface BackendApiStackProps extends cdk.StackProps {
  tableName: string
  allowedOrigins: string[]
}

export class BackendApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BackendApiStackProps) {
    super(scope, id, props)

    if (props.allowedOrigins.length === 0 || props.allowedOrigins.includes('*')) {
      throw new Error('Configure one or more explicit frontend origins; wildcard CORS is not allowed.')
    }

    const table = dynamodb.Table.fromTableName(this, 'ExistingEnvironmentalDataTable', props.tableName)
    const handler = new NodejsFunction(this, 'AetheraBackendHandler', {
      entry: path.resolve(__dirname, '../../backend/src/lambda.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.seconds(25),
      memorySize: 512,
      environment: {
        ENABLE_DYNAMODB: 'true',
        DYNAMODB_TABLE: props.tableName,
        ENABLE_BEDROCK: 'false',
        CORS_ORIGINS: props.allowedOrigins.join(','),
      },
      bundling: {
        externalModules: [],
        sourceMap: true,
        target: 'node22',
      },
    })

    handler.addToRolePolicy(new iam.PolicyStatement({
      actions: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:Query'],
      resources: [table.tableArn],
    }))

    const api = new apigwv2.HttpApi(this, 'AetheraHttpApi', {
      apiName: 'AetheraBackendApi',
      description: 'HTTP API for the Aethera environmental intelligence backend.',
      defaultIntegration: new HttpLambdaIntegration('AetheraLambdaIntegration', handler),
      corsPreflight: {
        allowOrigins: props.allowedOrigins,
        allowMethods: [apigwv2.CorsHttpMethod.ANY],
        allowHeaders: ['Content-Type', 'Authorization'],
        maxAge: cdk.Duration.hours(1),
      },
    })

    new cdk.CfnOutput(this, 'BackendApiUrl', {
      value: api.apiEndpoint,
      description: 'Set VITE_API_BASE_URL to this URL when building the frontend.',
    })
    new cdk.CfnOutput(this, 'BackendLambdaName', {
      value: handler.functionName,
    })
    new cdk.CfnOutput(this, 'ConnectedDynamoDBTable', {
      value: props.tableName,
    })
  }
}
