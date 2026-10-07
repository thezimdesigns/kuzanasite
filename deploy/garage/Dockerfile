# Garage (S3-compatible object storage) with a self-configuring entrypoint.
# The official image is a bare static binary, so it is copied onto Alpine
# to get a shell for first-boot setup.
FROM dxflrs/garage:v2.4.1 AS garage

FROM alpine:3.22
RUN apk add --no-cache ca-certificates
COPY --from=garage /garage /usr/local/bin/garage
COPY garage.toml /etc/garage.toml
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh && chmod +x /usr/local/bin/entrypoint.sh
VOLUME ["/var/lib/garage/meta", "/var/lib/garage/data"]
EXPOSE 3900
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=6 CMD test -f /tmp/garage-ready && garage status >/dev/null 2>&1
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
