/**
 * Health Check Lambda Function
 * Minimal handler to verify API Gateway integration works
 * Deploy as: HealthCheckFunction
 */

exports.handler = async (event) => {
  console.log('Health check invoked:', JSON.stringify(event, null, 2));

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
    body: JSON.stringify({
      status: 'ok',
      message: 'API Gateway is working correctly',
      timestamp: new Date().toISOString(),
      requestId: event.requestContext?.requestId || 'unknown'
    })
  };
};
