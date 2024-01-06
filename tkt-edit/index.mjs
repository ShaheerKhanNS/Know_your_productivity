import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
export const handler = async (event) => {
  const { ticketId, userId, title, description, sprint } = event;
  if (!title || !description || !sprint)
    return {
      status: false,
      message:
        "please check you are sending all three title,description and sprint along",
    };
  const ddbClient = new DynamoDBClient();
  const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
  try {
    const params = {
      TableName: "ticket-monitering-table",
      Key: {
        sk: `TCKT#${ticketId}`,
        pk: `USER#${userId}`,
      },
      UpdateExpression:
        "SET #title = :title,#description = :description,#sprint = :sprint",
      ExpressionAttributeNames: {
        "#title": "title",
        "#description": "description",
        "#sprint": "sprint",
      },
      ExpressionAttributeValues: {
        ":sprint": sprint,
        ":description": description,
        ":title": title,
      },
    };
    await ddbDocClient.send(new UpdateCommand(params));
    return {
      status: true,
      message: "success",
    };
  } catch (err) {
    console.log(JSON.stringify(err));
    return {
      status: false,
      message: "fail",
    };
  }
};
