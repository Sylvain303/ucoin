prefix = /usr/local
bindir = $(prefix)/bin
sharedir = $(prefix)/share
mandir = $(sharedir)/man
man1dir = $(mandir)/man1

NODEJS_VER=v0.12.9
INSTALL_UCOIN=${HOME}/ucoin/install.sh
#VERBOSE_RSYNC=-v

all: build-nodejs-lib

build-nodejs-lib: fetch-nodejs node_modules/q/package.json

node_modules/q/package.json:
	# environment must be change on the same line
	PATH=$$PATH:${CURDIR}/node/bin npm install

pwd:
	echo $$(pwd)
	echo ${CURDIR}

fetch-nodejs: install.sh node/bin/node

# install local nodejs
node/bin/node:
	${INSTALL_UCOIN} --call-only install_node_js ${NODEJS_VER} .

clean:
	rm -fr node/ node_modules/ coverage/
	rm -f node.tar.gz

# remove debian package done by install target
pkg-clean:
	rm -rf debian/ucoin/home

install: all
	install -d $(DESTDIR)/home/ucoin/.ucoin
	rsync ${VERBOSE_RSYNC} --exclude ".git" --exclude "coverage" --exclude "test"  \
     --exclude "share" --exclude debian --exclude node.tar.gz -rl\
    ./ $(DESTDIR)/home/ucoin/.ucoin/
#	install ucoin.sh $(DESTDIR)$(bindir)

