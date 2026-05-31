import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

import { ResolvedInfraConfig } from './config';

export interface DomainResources {
  zone?: route53.IHostedZone;
  certificate?: acm.ICertificate;
}

export function createDomainResources(
  scope: Construct,
  config: ResolvedInfraConfig,
): DomainResources {
  if (!config.domain.enabled) {
    return {};
  }

  const normalizedZone = config.domain.hostedZoneDomain?.replace(/\.$/, '');
  const zone = normalizedZone
    ? config.domain.hostedZoneId
      ? route53.HostedZone.fromHostedZoneAttributes(scope, 'HostedZone', {
          hostedZoneId: config.domain.hostedZoneId,
          zoneName: normalizedZone,
        })
      : route53.HostedZone.fromLookup(scope, 'HostedZone', {
          domainName: normalizedZone,
        })
    : undefined;

  let certificate: acm.ICertificate | undefined;

  if (config.domain.certificateMode === 'create-dns-validated' && zone) {
    certificate = new acm.Certificate(scope, 'Certificate', {
      domainName: config.domain.domainName!,
      validation: acm.CertificateValidation.fromDns(zone),
    });
  }

  if (config.domain.certificateMode === 'import' && config.domain.certificateArn) {
    certificate = acm.Certificate.fromCertificateArn(
      scope,
      'ImportedCertificate',
      config.domain.certificateArn,
    );
  }

  return {
    zone,
    certificate,
  };
}

export function createAliasRecord(
  scope: Construct,
  config: ResolvedInfraConfig,
  domain: DomainResources,
  loadBalancer: elbv2.IApplicationLoadBalancer,
): void {
  if (!config.domain.enabled || !config.domain.createAliasRecord || !domain.zone) {
    return;
  }

  new route53.ARecord(scope, 'AliasRecord', {
    zone: domain.zone,
    recordName: config.domain.recordName,
    target: route53.RecordTarget.fromAlias(
      new targets.LoadBalancerTarget(loadBalancer),
    ),
  });
}