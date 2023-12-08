FROM library/node:lts-bullseye

ARG DEBIAN_FRONTEND=noninteractive
RUN apt update \
    && apt install -y --no-install-recommends sudo \
    && apt autoremove -y \
    && rm -rf /var/lib/apt/lists/* \
    && echo "node ALL=(ALL) NOPASSWD: ALL" >/etc/sudoers.d/node \
    && chmod 0440 /etc/sudoers.d/node

ADD src /src
ADD tsconfig.json /tsconfig.json
ADD package-lock.json /package-lock.json
ADD package.json /package.json
RUN npm ci

# Build your TypeScript files
RUN npm run build

# The command to start your app
CMD ["npm", "start"]
