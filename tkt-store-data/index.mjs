import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

export const handler = async (event) => {
  const { employeeId, sprint, category, title, description } = event;
  console.log("invoked");
  if (!employeeId || !sprint || !title || !description || !category)
    throw new Error("Missing params");
  try {
    const ddbClient = new DynamoDBClient();
    const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
    const category = event.category.toUpperCase();
    const ticketId = randomUUID();
    const item = {
      pk: `USER#${event.userId}`,
      sk: `TCKT#${ticketId}`,
      sk1: Date.now(),
      employeeId,
      sprint,
      category,
      description,
      userId: event.userId,
      addedAt: Date.now(),
      ticketId,
      endTime: 0,
      effort: [],
      title,
      status: "idle",
      isPaused: "false",
      noOfAttempts: 0,
      timeHistory: [],
      history: [],
      // validation purpose
      currentAction: "none",
      // to render counter
      initialStartedTime: 0,
      totalTimeSpent: 0,
    };

    const params = {
      TableName: "ticket-monitering-table",

      Item: item,
    };
    await ddbDocClient.send(new PutCommand(params));

    return {
      status: true,
      message: "success",
    };
  } catch (err) {
    console.log(err);
    return {
      status: false,
      message: err.message || "fail",
    };
  }
};
