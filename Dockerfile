from node:20-alpine

copy . .

run npm ci
run npm run build

cmd "npm run start"

expose 3000