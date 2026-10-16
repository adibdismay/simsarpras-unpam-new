# SIMSARPRAS UNPAM — image untuk Back4App Containers (free tier, tanpa kartu).
# Node 22 dibutuhkan oleh node:sqlite (stdlib, tanpa dependensi native).
FROM node:22-alpine

WORKDIR /app

# Salin manifest dulu agar layer npm bisa di-cache.
COPY package.json ./
RUN npm install

# Salin seluruh aplikasi (frontend + server.js).
COPY . ./

# Konvensi Back4App: container melayani HTTP di port 80.
# Jika platform menginjeksi PORT, nilai injeksi akan menimpa ENV ini.
ENV PORT=80
EXPOSE 80

CMD ["node", "server.js"]
