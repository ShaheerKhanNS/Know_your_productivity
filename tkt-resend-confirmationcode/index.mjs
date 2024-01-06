import {
  CognitoIdentityProviderClient,
  ResendConfirmationCodeCommand,
} from "@aws-sdk/client-cognito-identity-provider";

export const handler = async (event) => {
  const { Username } = event;
  try {
    const client = new CognitoIdentityProviderClient();

    const input = {
      ClientId: "4ba0e741d1tdevorj8mq37cqls",
      Username,
    };
    const command = new ResendConfirmationCodeCommand(input);
    await client.send(command);
    return {
      status: true,
      message: `Mail has been sent to ${Username}.Please confirm the account within 24 hrs.📨`,
    };
  } catch (err) {
    return {
      status: false,
      message: err.message || "Some thing went wrong",
    };
  }
};
