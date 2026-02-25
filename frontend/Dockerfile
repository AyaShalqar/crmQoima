FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Force rebuild - cache bust v2
ARG CACHEBUST=1

# Build-time argument for API URL
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN echo "Building with API_URL: $NEXT_PUBLIC_API_URL" && npm run build

ENV PORT=3000
EXPOSE 3000

CMD ["sh", "-c", "npm start -- -p ${PORT:-3000}"]
