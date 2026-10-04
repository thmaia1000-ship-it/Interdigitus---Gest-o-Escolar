FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copia manifestos de pacotes
COPY package*.json ./

# Instala todas as dependências necessárias para build e runtime
RUN npm install

# Copia todo o código fonte e os dados do banco de dados (data_interdigitus.json)
COPY . .

# Compila o frontend React com Vite
RUN npm run build

# Expõe a porta dinâmica para o Google Cloud Run
EXPOSE 8080

# Inicia o servidor Express integrado
CMD ["npm", "start"]
