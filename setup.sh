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
fi;
echo "Copying files to $ROOT..."
cd dist
sudo cp -r ./* $ROOT
echo "Done!"