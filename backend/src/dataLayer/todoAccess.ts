import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { createLogger } from '../utils/logger';

const logger = createLogger('todosDataAccess');

const XAWS = AWSXRay.captureAWS(AWS)
export class TodoAccess {

  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE) {
  }

  async getAllTodos(userId: String): Promise<TodoItem[]> {
    logger.info(`Querying todos for user with id ${userId}`)

    const result = await this.docClient.query({
      TableName: this.todosTable,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId
      },
      ScanIndexForward: false
    }).promise()

    const items = result.Items

    logger.info(`Todos query result for user ${userId}: ${items}`)

    return items as TodoItem[]
  }

  async createTodo(todoItem: TodoItem): Promise<TodoItem> {
    logger.info(`Creating todo for data ${todoItem}`)

    await this.docClient.put({
      TableName: this.todosTable,
      Item: todoItem
    }).promise()

    logger.info(`Created todo ${todoItem}`)

    return todoItem
  }

  async updateTodo(todoId: String, updateBody: TodoUpdate, userId: String) {

    logger.info(`Updating todo for todoId ${todoId} and userid ${userId}`)

    var params = {
        TableName: this.todosTable,
        Key: { todoId, userId },
        UpdateExpression: `set #N = :n, dueDate = :due, done = :done`,
        ExpressionAttributeNames: {
            "#N": "name"
        },
        ExpressionAttributeValues: {
            ':n' : updateBody.name,
            ':due': updateBody.dueDate,
            ':done': updateBody.done
        },
        ReturnValues: "ALL_NEW"
    };

    const updatedItem =  await this.docClient.update(params).promise()

    logger.info(`Updated todo for todoId ${todoId} and userid ${userId}. New item: ${updatedItem}`)

    return updatedItem
  }

  async deleteTodo(todoId: String, userId: String) {
    logger.info(`Deleting todo for todoId ${todoId} and userid ${userId}`)

    var params = {
        TableName: this.todosTable,
        Key: {todoId, userId}
    }

    const result = await this.docClient.delete(params).promise()

    logger.info(`Deleted todo for todoId ${todoId} and userid ${userId}`)

    return result
  }
}

function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
		console.log('Creating a local DynamoDB instance')
		return new XAWS.DynamoDB.DocumentClient({
			region: 'localhost',
			endpoint: 'http://localhost:8000'
		})
    }

    return new XAWS.DynamoDB.DocumentClient()
}