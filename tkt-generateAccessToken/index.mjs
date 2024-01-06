import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

export const handler = async (event) => {
  const { refreshToken } = event;

  if (!refreshToken)
    return {
      status: false,
      message: "Missing Refresh-Token in headers",
    };

  try {
    const client = new CognitoIdentityProviderClient();
    const input = {
      AuthFlow: "REFRESH_TOKEN",
      ClientId: "4ba0e741d1tdevorj8mq37cqls",
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    };
    const command = new InitiateAuthCommand(input);
    const response = await client.send(command);
    return {
      status: true,
      AccessToken: response.AuthenticationResult.AccessToken,
    };
  } catch (err) {
    return {
      status: false,
      message: `${
        err.__type === "NotAuthorizedException"
          ? "Invalid Refresh Token"
          : "Something went wrong"
      }`,
    };
  }
};
