#!/bin/sh
WEBSITE="pi-robot-car.duckdns.org"
ROOT="/var/www/"
if [ "$1" = "" ]
then
    ROOT=$ROOT$WEBSITE
else
    ROOT=$ROOT$1
fi;
if [ -d $ROOT ]
then
    echo "$ROOT already exists."
else
    echo "$ROOT does not exist. Creating folder..."
    sudo mkdir $ROOT
    sudo mkdir $ROOT/assets
    sudo mkdir $ROOT/assets/img
fi;
echo "Copying files to $ROOT..."
sudo cp index.html $ROOT
sudo cp client.js $ROOT
sudo cp common/common.js $ROOT
sudo cp -r assets/* $ROOT/assets

echo "Done!"