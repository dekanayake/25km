import cdk = require('@aws-cdk/core');
import s3 = require('@aws-cdk/aws-s3');
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import { ProjectionType } from '@aws-cdk/aws-dynamodb';
import iam =  require('@aws-cdk/aws-iam');
import lambda = require('@aws-cdk/aws-lambda');
import { Duration } from '@aws-cdk/core';
import apigateway = require('@aws-cdk/aws-apigateway'); 
import {AwsCustomResource,AwsCustomResourcePolicy} from '@aws-cdk/custom-resources';

interface ApiLambdaProps  {
}

export class ApiLambdaStack extends cdk.Stack {
    constructor(app: cdk.App, id: string, props: ApiLambdaProps){
        super(app, id);

        const placesLambda = new lambda.Function(this, "placesLambda", {
            functionName: 'placesLambda',
            description: 'Places lambda',
            code: lambda.Code.fromAsset("./lambda/place-nearby-lambda/places-service.zip"),
            handler: 'handler.nearByPlaces',
            timeout:Duration.minutes(1),
            runtime: lambda.Runtime.NODEJS_12_X,
          });

          const apiGatewayRestApi = new apigateway.RestApi(this, "placesApi",  {
            deployOptions: {
              loggingLevel: apigateway.MethodLoggingLevel.INFO,
              dataTraceEnabled: true
            },
            defaultCorsPreflightOptions: {
              allowOrigins: apigateway.Cors.ALL_ORIGINS,
              allowMethods: apigateway.Cors.ALL_METHODS ,
            }
          });

          const places = apiGatewayRestApi.root.addResource("places")
          const nearBy = places.addResource("nearBy")

          const placesLambdaIntegration = new apigateway.LambdaIntegration(placesLambda,{
            contentHandling: apigateway.ContentHandling.CONVERT_TO_BINARY,
            allowTestInvoke:true
          });

          nearBy.addMethod("POST", placesLambdaIntegration)
    }
}

