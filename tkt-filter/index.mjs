import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { QueryCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

async function getTickets(start, end, userId) {
  const client = new DynamoDBClient();
  const docClient = DynamoDBDocumentClient.from(client);

  try {
    const params = {
      TableName: "ticket-monitering-table",
      IndexName: "sk1-createdDate",
      KeyConditionExpression: "#pk = :pk AND #sk1 BETWEEN :start AND :end",
      ExpressionAttributeNames: {
        "#pk": "pk",
        "#sk1": "sk1",
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":start": start,
        ":end": end,
      },
      ProjectionExpression:
        "ticketId,totalTimeSpent,#status,title,description,category,addedAt,noOfAttempts,sprint,isPaused",
    };
    const command = new QueryCommand(params);
    const { Count, Items } = await docClient.send(command);

    let closedTickets = 0;
    let openTickets = 0;
    let idleTickets = 0;
    let pausedTicket = 0;

    let totalTimeSpendOnAllTickets = 0;
    if (Count > 0) {
      for (let i = 0; i < Items.length; i++) {
        if (Items[i].status === "closed") closedTickets++;
        if (Items[i].status === "open") openTickets++;
        if (Items[i].status === "idle") idleTickets++;
        if (Items[i].isPaused === "true") pausedTicket++;
        totalTimeSpendOnAllTickets += Items[i].totalTimeSpent;
      }
    }

    let inProgressTicket = openTickets - pausedTicket;

    return {
      Count,
      Items,
      closedTickets,
      idleTickets,
      inProgressTicket,
      pausedTicket,
      totalTimeSpendOnAllTickets,
    };
  } catch (err) {
    console.log(JSON.stringify(err));
    return {
      status: false,
      message: "fail",
    };
  }
}

export const handler = async (event) => {
  const { filter, userId, startTime, endTime } = event;

  let time,
    start,
    end,
    specificDay,
    Count,
    Items,
    closedTickets,
    idleTickets,
    pausedTicket,
    inProgressTicket,
    totalTimeSpendOnAllTickets;

  switch (filter) {
    case "daily":
      time = Date.now();
      const currentDay = new Date(time);
      start = currentDay.setHours(0, 0, 0, 0);
      end = currentDay.setHours(23, 59, 59, 999);

      ({
        Count,
        Items,
        closedTickets,
        idleTickets,
        inProgressTicket,
        pausedTicket,
        totalTimeSpendOnAllTickets,
      } = await getTickets(start, end, userId));
      return {
        status: true,
        message: "getting daily reports",
        Count,
        Items,
        closedTickets,
        inProgressTicket,
        idleTickets,
        pausedTicket,
        totalTimeSpendOnAllTickets,
      };

    case "weekly":
      time = Date.now();

      specificDay = new Date(time);

      const currentDayOfWeek = specificDay.getDay();

      const startOfWeekTimeStamp = new Date(specificDay);
      startOfWeekTimeStamp.setDate(specificDay.getDate() - currentDayOfWeek);
      start = startOfWeekTimeStamp.setHours(0, 0, 0, 0);

      const endOfWeekTimestamp = new Date(specificDay);
      endOfWeekTimestamp.setDate(
        specificDay.getDate() + (6 - currentDayOfWeek)
      );
      end = endOfWeekTimestamp.setHours(23, 59, 59, 999);

      ({
        Count,
        Items,
        closedTickets,
        idleTickets,
        inProgressTicket,
        pausedTicket,
        totalTimeSpendOnAllTickets,
      } = await getTickets(start, end, userId));
      return {
        status: true,
        message: "getting weekly reports",
        Count,
        Items,
        closedTickets,
        inProgressTicket,
        idleTickets,
        pausedTicket,
        totalTimeSpendOnAllTickets,
      };
    case "monthly":
      time = Date.now();

      specificDay = new Date(time);

      const startOfMonthTimestamp = new Date(
        specificDay.getFullYear(),
        specificDay.getMonth(),
        1
      );
      start = startOfMonthTimestamp.setHours(0, 0, 0, 0);

      const endOfMonthTimestamp = new Date(
        specificDay.getFullYear(),
        specificDay.getMonth() + 1,
        0
      );
      end = endOfMonthTimestamp.setHours(23, 59, 59, 999);
      ({
        Count,
        Items,
        closedTickets,
        idleTickets,
        inProgressTicket,
        pausedTicket,
        totalTimeSpendOnAllTickets,
      } = await getTickets(start, end, userId));
      return {
        status: true,
        message: "getting monthly reports",
        Count,
        Items,
        closedTickets,
        inProgressTicket,
        idleTickets,
        pausedTicket,
        totalTimeSpendOnAllTickets,
      };
    case "custom":
      if (!startTime || !endTime)
        return {
          status: false,
          message: "Please provide custom dates",
        };

      start = Number(startTime);
      end = Number(endTime);

      ({
        Count,
        Items,
        closedTickets,
        idleTickets,
        inProgressTicket,
        pausedTicket,
        totalTimeSpendOnAllTickets,
      } = await getTickets(start, end, userId));

      return {
        status: true,
        message: "getting custom reports",
        Count,
        Items,
        closedTickets,
        idleTickets,
        pausedTicket,
        totalTimeSpendOnAllTickets,
      };

    default:
      return {
        statusCode: 400,
        status: false,
        message: "unknown action",
      };
  }
};
