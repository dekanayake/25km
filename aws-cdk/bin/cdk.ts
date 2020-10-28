#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ApiLambdaStack  } from '../lib/api-lambda-stack';


const app = new cdk.App();


const apiLambdaStack = new ApiLambdaStack(app, 'places-api-stack',{
})









