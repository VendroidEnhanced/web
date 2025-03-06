FROM node:slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit dev
COPY dist/index.js /app
VOLUME ["/app/data"]
EXPOSE 8637
CMD ["node", "index.js"]