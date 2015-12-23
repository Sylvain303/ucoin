#!/bin/bash
#
# manual install on yunohost.
# sudo command from admin@yunohost

install_nodejs() {
sudo apt-get install curl g++ make
curl --silent --location https://deb.nodesource.com/setup_0.12 | sudo bash -E -
sudo apt-get install nodejs
}

add_ucoin_user() {
	sudo adduser ucoin
}

install_ucoin_code() {
	sudo su - ucoin
	git clone https://github.com/ucoin-io/ucoin
	cd ucoin
	npm install
	npm install pm2
}

install_bin() {
	cd
	mkdir bin
	ln -s -f $HOME/ucoin/bin/ucoind bin/
	ln -s -f $HOME/ucoin/node_modules/pm2/bin/pm2 bin/

	#export PATH=$PATH:~/bin
}

configure_ucoin_node() {

	# Configure uCoin node
	$ucoin init --autoconf
	$ucoin config --remoteh $domain --port $port --remotep $port --salt $salt --passwd $password # --cpu $cpu
}

finalize_install() {
port=22322
sudo yunohost firewall allow TCP $port

}

synchronise_ucoin_node() {

# Synchronize uCoin node (24 min)
echo "Synchronizing with $sync_node:$sync_port"
$ucoin sync $sync_node $sync_port --nointeractive > /dev/null 2>&1

}
