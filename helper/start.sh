#!/bin/bash
# 
# start a dev install of ucoin
# See doc/dev_install.md

cd ~/ucoin/
nohup node --harmony ~/ucoin/bin/ucoind start >> ~/ucoin.log &

