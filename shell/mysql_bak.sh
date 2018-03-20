#!/bin/bash

# 要备份的数据库名，多个数据库用空格分开
databases=(TLS_MIS)

# 备份文件要保存的目录
basepath=$1;

# 备份文件的文件名
filename=$2;

if [ ! -d "$basepath" ]; then
  mkdir -p "$basepath"
fi

# 循环databases数组
for db in ${databases[*]}
  do
    # 备份数据库生成SQL文件
    /bin/nice -n 19 /usr/bin/mysqldump -uTLS_MIS -pTLS_MIS --database $db > $basepath$filename.sql
    
    # 将生成的SQL文件压缩
    /bin/nice -n 19 tar zPcf $basepath$filename.tar.gz $basepath$filename.sql
    
    # 删除30天之前的备份数据
    find $basepath -mtime +30 -name "*.tar.gz" -exec rm -rf {} \;
  done

  # 删除生成的SQL文件
  rm -rf $basepath/*.sql
