import {
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";

export const handler = async (event) => {
  try {
    const { Username, ConfirmationCode, Password } = event;
    const client = new CognitoIdentityProviderClient();

    const input = {
      ClientId: "4ba0e741d1tdevorj8mq37cqls",
      Username,
      ConfirmationCode,
      Password,
    };
    const command = new ConfirmForgotPasswordCommand(input);
    await client.send(command);

    return {
      status: true,
      message: "Password reset successfully😍",
    };
  } catch (err) {
    return {
      status: false,
      message: "Provide correct OTP",
    };
  }
};
