FROM node:20

# Define o diretório de trabalho
WORKDIR /usr/src/app

# Copia os arquivos de dependência e instala as dependências
COPY package*.json ./
RUN yarn

# Copia o restante do código para o container
COPY . .

# Compila o código caso você use TypeScript ou outras ferramentas de build
RUN npm run build

# Define a porta de escuta padrão
ENV PORT=8080

# Inicia o servidor no container
CMD ["npm", "start"]