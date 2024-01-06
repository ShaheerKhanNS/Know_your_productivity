import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  GetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

export const handler = async (event) => {
  const { email, password, userAgent } = event;
  const time = Date.now();
  console.log(email);
  try {
    const client = new CognitoIdentityProviderClient();
    const input = {
      AuthFlow: "USER_PASSWORD_AUTH",
      AuthParameters: {
        email: email,
        PASSWORD: password,
        USERNAME: email,
      },
      ClientId: "4ba0e741d1tdevorj8mq37cqls",
    };
    const command = new InitiateAuthCommand(input);
    const response = await client.send(command);
    const AccessToken = response.AuthenticationResult.AccessToken;
    const RefreshToken = response.AuthenticationResult.RefreshToken;

    const params = {
      AccessToken,
    };

    const order = new GetUserCommand(params);
    const user = await client.send(order);

    console.log(user.UserAttributes);

    const employeeId = user.UserAttributes[0]?.Value;
    const name = user.UserAttributes[3]?.Value;
    const userEmail = user.UserAttributes[4]?.Value;

    const profilePic = user.UserAttributes[5]?.Value;

    const ddbClient = new DynamoDBClient();
    const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

    const updateParams = {
      TableName: "ticket-monitering-table",
      Key: {
        pk: `USR#DETAILS`,
        sk: `USER#${user.Username}`,
      },
      UpdateExpression:
        "SET #loggedIn = :loggedIn,#userAgent = :userAgent,#userDetails = :userDetails",
      ExpressionAttributeNames: {
        "#loggedIn": "loggedIn",
        "#userAgent": "userAgent",
        "#userDetails": "userDetails",
      },
      ExpressionAttributeValues: {
        ":loggedIn": time,
        ":userAgent": userAgent,
        ":userDetails": user.UserAttributes,
      },
    };
    await ddbDocClient.send(new UpdateCommand(updateParams));

    return {
      employeeId,
      name,
      userEmail,
      AccessToken,
      status: true,
      message: "success",
      RefreshToken,
      profilePic,
    };
  } catch (err) {
    console.log(err);
    return {
      status: false,
      message: `${
        err.__type === "NotAuthorizedException"
          ? "Incorrect username or password🔴"
          : err.__type === "UserNotConfirmedException"
          ? "A confirmation link will be sent to your registered mail-id"
          : "Something went wrong"
      }`,
    };
  }
};
