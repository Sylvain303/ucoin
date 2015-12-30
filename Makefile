prefix = /usr/local
bindir = $(prefix)/bin
sharedir = $(prefix)/share
mandir = $(sharedir)/man
man1dir = $(mandir)/man1

NODEJS_VER=v0.12.9
INSTALL_UCOIN=${HOME}/ucoin/install.sh

all: build-nodejs-lib

build-nodejs-lib: fetch-nodejs
	export PATH=${PATH}:${PWD}/node/bin
	npm install

fetch-nodejs: install.sh node/bin/node

# install local nodejs
node/bin/node:
	${INSTALL_UCOIN} --call-only install_node_js ${NODEJS_VER} .

clean:
	rm -fr node/ node_modules/
	rm -f node.tar.gz

install: all
	install ucoin.sh $(DESTDIR)$(bindir)
