# Deploy Hooks for SSM layers

A notable error you may encounter when working with Lambda Layers stored as Stackery environment variables, is an Invalid Lambda ARN error. If permissions for the Lambda Layer are scoped correctly, and you've confirmed it exists (in your account or another), the error may be related to this [open SAM build issue](https://github.com/awslabs/aws-sam-cli/issues/1069).

Stackery environment variables are stored in AWS SSM Parameter Store, which when used to store Lambda Layers, fails to properly resolve them. This GitHub repository has the deployHooks directory, and deployment hook override scripts needed to continue using the Local and CodeBuild deployment strategies.
