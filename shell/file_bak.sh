#!/bin/bash

echo "====";
# 要备份的目录
bakpath=$1;

# 备份文件的保存位置
targetpath=$2;

# 备份文件的文件名
filename=$3;

if [ ! -d "$targetpath" ]; then
  mkdir -p "$targetpath"
fi

# 备份文件目录
/bin/nice -n 19 tar zcvf $targetpath$filename.tar.gz $bakpath

# 删除30天之前的备份数据
find $targetpath -mtime +30 -name "*.tar.gz" -exec rm -rf {} \;
