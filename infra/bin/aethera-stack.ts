#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AetheraStack } from '../lib/aethera-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT || '123456789012',
  region: process.env.CDK_DEFAULT_REGION || 'ap-south-1',
};

new AetheraStack(app, 'SaansSaathiStack', {
  env,
  description: 'Saans Saathi / Aethera Minimal Serverless Production Stack (Cost-Controlled)',
  tags: {
    Project: 'SaansSaathi',
    Track: 'Air',
    Environment: 'Production',
    Team: 'Prometheus',
  },
});
