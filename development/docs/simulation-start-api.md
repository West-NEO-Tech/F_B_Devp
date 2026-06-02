点击Simulation后，网址中会多出包含runid=XX的字段，把runid输入到
GET /api/runs/{run_id}/agents
这个接口中，会得到agent所有需要的用户输入的结构化信息。

{
  "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "scenarioId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "seedMaterialId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "generating",
  "message": "string",
  "description": "string",
  "productType": "string",
  "consumerPersonas": [
    "string"
  ],
  "discussionTopics": [
    "string"
  ],
  "additionalInformation": [
    {
      "question": "string",
      "answer": "string"
    }
  ],
  "simConfigType": "quick"
}