# This crontab entry runs the following shell script 30 mins after midnight.
# Create a crontab entry with `crontab -e` and type the lines 
# between 'begin:' and 'end:' (without the leading #)
#
# -------- begin: crontab entry ------------------------
# HOME=/Users/punkish
# APPDIR=Projects/zenodeo/zenodeo3
# 30 0 * * * cd $HOME/$APPDIR && bin/cron-rsync.sh
# -------- end: crontab entry --------------------------

rsync -azvv --exclude-from=./bin/exclude-rsync.txt ./data lko:/home/punkish/Projects/zenodeo3