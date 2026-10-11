#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BackendApiStack } from '../lib/backend-api-stack';

const app = new cdk.App();
const tableName = String(app.node.tryGetContext('dynamodbTable') ?? 'AtheraEnvironmentalData').trim();
const allowedOriginsValue = String(
  app.node.tryGetContext('corsOrigins') ?? 'http://localhost:5173,http://127.0.0.1:5173',
)
const allowedOrigins = allowedOriginsValue.split(',').map((origin) => origin.trim()).filter(Boolean)

new BackendApiStack(app, 'AetheraBackendApiStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? process.env.AWS_REGION ?? 'us-east-1',
  },
  tableName,
  allowedOrigins,
  description: 'Aethera Express API on AWS Lambda and API Gateway HTTP API.',
  tags: {
    Project: 'Aethera',
    Environment: 'Backend',
  },
});
