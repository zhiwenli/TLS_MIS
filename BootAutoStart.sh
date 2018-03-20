#!/bin/bash
forever start -al forever.log -o log/out.log -e log/err.log bin/www
#将此文件设置为开机启动脚本
