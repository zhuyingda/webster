FROM centos:7.4.1708
MAINTAINER zhuyingda "yingdazhu@icloud.com"
RUN yum install pango.x86_64 libXcomposite.x86_64 libXcursor.x86_64 \
    libXdamage.x86_64 libXext.x86_64 libXi.x86_64 libXtst.x86_64 \
    cups-libs.x86_64 libXScrnSaver.x86_64 libXrandr.x86_64 GConf2.x86_64 \
    alsa-lib.x86_64 atk.x86_64 gtk3.x86_64 -y
RUN yum install ipa-gothic-fonts xorg-x11-fonts-100dpi \
    xorg-x11-fonts-75dpi xorg-x11-utils xorg-x11-fonts-cyrillic \
    xorg-x11-fonts-Type1 xorg-x11-fonts-misc -y
RUN yum install wget -y
RUN rm -rf /var/cache/yum
RUN adduser work
RUN wget https://nodejs.org/dist/v8.10.0/node-v8.10.0-linux-x64.tar.xz \
    -O /home/work/node-v8.10.0-linux-x64.tar.xz
RUN xz -d /home/work/node-v8.10.0-linux-x64.tar.xz
RUN tar -xvf /home/work/node-v8.10.0-linux-x64.tar -C /home/work/
RUN ln -s /home/work/node-v8.10.0-linux-x64/bin/node /usr/local/bin/node
RUN ln -s /home/work/node-v8.10.0-linux-x64/bin/npm /usr/local/bin/npm
RUN rm /home/work/node-v8.10.0-linux-x64.tar
USER work
RUN mkdir /home/work/webster_runtime
WORKDIR /home/work/webster_runtime
RUN npm init -y
RUN npm i --save webster@latest

# put your own crawler code into image here
# COPY xxx /home/work/webster_runtime/