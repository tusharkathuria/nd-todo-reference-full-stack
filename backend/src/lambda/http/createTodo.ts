import 'source-map-support/register'

import { APIGatewayProxyResult } from 'aws-lambda'
import { createTodo } from '../../businessLogic/todos'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { middyfy } from '../../utils/middleware'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger';

const logger = createLogger('createTodoLambda');

const createTodoHandler = async (event): Promise<APIGatewayProxyResult> => {
  logger.info(`Processing event: ${event}`)

  const newTodo: CreateTodoRequest = event.body

  if([newTodo.name, newTodo.dueDate].includes("")) {
    logger.error("Request body has empty name or due date")

    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Request body has empty name or due date" })
    }
  }

  const userId = getUserId(event)
  const newItem = await createTodo(newTodo, userId)

  const response =  {
    statusCode: 201,
    body: JSON.stringify({ item: newItem })
  }

  logger.info(`Event Response: ${response}`)

  return response
}

export const handler = middyfy(createTodoHandler);