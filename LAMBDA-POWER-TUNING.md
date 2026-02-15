service: lambda-power-tuning

frameworkVersion: '4'

provider:
  name: aws
  runtime: python3.11
  region: us-west-2
  profile: pa-dev
  stage: dev

resources:
  Resources:
    # State Machine para Power Tuning
    PowerTuningStateMachine:
      Type: AWS::StepFunctions::StateMachine
      Properties:
        StateMachineName: lambda-power-tuning-dev
        RoleArn: !GetAtt StepFunctionsRole.Arn
        DefinitionString: !Sub |
          {
            "Comment": "AWS Lambda Power Tuning state machine",
            "StartAt": "Initializer",
            "States": {
              "Initializer": {
                "Type": "Task",
                "Resource": "${InitializerFunction.Arn}",
                "Next": "Executor",
                "Catch": [{
                  "ErrorEquals": ["States.ALL"],
                  "Next": "CleanUpOnError"
                }]
              },
              "Executor": {
                "Type": "Map",
                "ItemsPath": "$.lambdaConfigurations",
                "Iterator": {
                  "StartAt": "ExecuteFunction",
                  "States": {
                    "ExecuteFunction": {
                      "Type": "Task",
                      "Resource": "${ExecutorFunction.Arn}",
                      "End": true
                    }
                  }
                },
                "Next": "Analyzer"
              },
              "Analyzer": {
                "Type": "Task",
                "Resource": "${AnalyzerFunction.Arn}",
                "Next": "Optimizer"
              },
              "Optimizer": {
                "Type": "Task",
                "Resource": "${OptimizerFunction.Arn}",
                "Next": "Cleaner"
              },
              "Cleaner": {
                "Type": "Task",
                "Resource": "${CleanerFunction.Arn}",
                "End": true
              },
              "CleanUpOnError": {
                "Type": "Task",
                "Resource": "${CleanerFunction.Arn}",
                "End": true
              }
            }
          }

    # IAM Role para Step Functions
    StepFunctionsRole:
      Type: AWS::IAM::Role
      Properties:
        AssumeRolePolicyDocument:
          Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Principal:
                Service: states.amazonaws.com
              Action: sts:AssumeRole
        ManagedPolicyArns:
          - arn:aws:iam::aws:policy/service-role/AWSLambdaRole

    # Funciones Lambda (referenciadas desde el repositorio original)
    InitializerFunction:
      Type: AWS::Lambda::Function
      Properties:
        FunctionName: power-tuning-initializer
        Runtime: python3.11
        Handler: index.lambda_handler
        Role: !GetAtt LambdaExecutionRole.Arn
        Code:
          ZipFile: |
            def lambda_handler(event, context):
                # Placeholder - usar código del repo oficial
                return event

    ExecutorFunction:
      Type: AWS::Lambda::Function
      Properties:
        FunctionName: power-tuning-executor
        Runtime: python3.11
        Handler: index.lambda_handler
        Role: !GetAtt LambdaExecutionRole.Arn
        Timeout: 300
        Code:
          ZipFile: |
            def lambda_handler(event, context):
                return event

    AnalyzerFunction:
      Type: AWS::Lambda::Function
      Properties:
        FunctionName: power-tuning-analyzer
        Runtime: python3.11
        Handler: index.lambda_handler
        Role: !GetAtt LambdaExecutionRole.Arn
        Code:
          ZipFile: |
            def lambda_handler(event, context):
                return event

    OptimizerFunction:
      Type: AWS::Lambda::Function
      Properties:
        FunctionName: power-tuning-optimizer
        Runtime: python3.11
        Handler: index.lambda_handler
        Role: !GetAtt LambdaExecutionRole.Arn
        Code:
          ZipFile: |
            def lambda_handler(event, context):
                return event

    CleanerFunction:
      Type: AWS::Lambda::Function
      Properties:
        FunctionName: power-tuning-cleaner
        Runtime: python3.11
        Handler: index.lambda_handler
        Role: !GetAtt LambdaExecutionRole.Arn
        Code:
          ZipFile: |
            def lambda_handler(event, context):
                return event

    # IAM Role para las Lambdas de Power Tuning
    LambdaExecutionRole:
      Type: AWS::IAM::Role
      Properties:
        AssumeRolePolicyDocument:
          Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Principal:
                Service: lambda.amazonaws.com
              Action: sts:AssumeRole
        ManagedPolicyArns:
          - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
          - arn:aws:iam::aws:policy/AWSLambda_FullAccess

  Outputs:
    StateMachineArn:
      Value: !Ref PowerTuningStateMachine
      Export:
        Name: power-tuning-state-machine-arn
