# Sunday, the budgeting day

This is a budgeting helper tool that simply uses AI to categorize credit card line items based on their description. The prompt inherently depends on a static location which is Vancouver, BC.

# Run instructions
`bash run.sh` - this should run the docker-compose based on the `.env`. In prod mode, the backend will pull a docker image from my docker hub, and the frontend will be built and served as static files on vite.

