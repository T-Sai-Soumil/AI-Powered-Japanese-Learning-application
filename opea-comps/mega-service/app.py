import os
from comps import MicroService, ServiceOrchestrator
from comps.cores.mega.constants import ServiceType, ServiceRoleType
from fastapi import HTTPException

from comps.cores.proto.api_protocol import (
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatCompletionResponseChoice,
    ChatMessage,
    UsageInfo,
)

EMBEDDING_SERVICE_HOST_IP = os.getenv("EMBEDDING_SERVICE_HOST_IP", "0.0.0.0")
EMBEDDING_SERVICE_PORT = os.getenv("EMBEDDING_SERVICE_PORT", 6000)
LLM_SERVICE_HOST_IP = os.getenv("LLM_SERVICE_HOST_IP", "0.0.0.0")
LLM_SERVICE_PORT = os.getenv("LLM_SERVICE_PORT", 9000)


class ExampleService:
    def __init__(self, host="0.0.0.0", port=8000):
        print('hello')
        self.host = host
        self.port = port
        self.endpoint = "/v1/example-service"
        self.megaservice = ServiceOrchestrator()

    def add_remote_service(self):
        #embedding = MicroService(
            #name="embedding",
            #host=EMBEDDING_SERVICE_HOST_IP,
            #port=EMBEDDING_SERVICE_PORT,
            #endpoint="/v1/embeddings",
            #use_remote_service=True,
            #service_type=ServiceType.EMBEDDING,
        #)
        llm = MicroService(
            name="llm",
            host=LLM_SERVICE_HOST_IP,
            port=LLM_SERVICE_PORT,
            endpoint="/v1/chat/completions",
            use_remote_service=True,
            service_type=ServiceType.LLM,
        )
        #self.megaservice.add(embedding).add(llm)
        self.megaservice.add(llm)
        #self.megaservice.flow_to(embedding, llm)

    def start(self):

        self.service = MicroService(
            self.__class__.__name__,
            service_role=ServiceRoleType.MEGASERVICE,
            host=self.host,
            port=self.port,
            endpoint=self.endpoint,
            input_datatype=ChatCompletionRequest,
            output_datatype=ChatCompletionResponse,
        )

        self.service.add_route(self.endpoint, self.handle_request, methods=["POST"])

        self.service.start()    
        
    async def handle_request(self,request: ChatCompletionRequest) -> ChatCompletionResponse:
        try:
            # Schedule the request through the orchestrator
            print("Before schedule")
            result = await self.megaservice.schedule(request.dict())
            print("RESULT =", result)
            print("After schedule")
            #result = "Hello from MegaService"

            # Create the response
            response = ChatCompletionResponse(
                model=request.model or "example-model",
                choices=[
                    ChatCompletionResponseChoice(
                        index=0,
                        message=ChatMessage(
                            role="assistant",
                            content=str(result)  # Convert the result to string if it isn't already
                        ),
                        finish_reason="stop"
                    )
                ],
                usage=UsageInfo(
                    prompt_tokens=0,
                    completion_tokens=0,
                    total_tokens=0
                )
            )

            return response

        except Exception as e:
            # Handle any errors
            raise HTTPException(
                status_code=500,
                detail=str(e)
            )    

example=ExampleService()
example.add_remote_service()        
example.start()