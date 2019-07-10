const yaml = require('js-yaml');
const fs = require('fs');
const AWS = require('aws-sdk');
const execFileSync = require('child_process').execFileSync;
const info = JSON.parse(process.argv[2]);

const CF_SCHEMA = yaml.Schema.create(yaml.CORE_SCHEMA, [
  new yaml.Type('!Ref', { kind: 'scalar', construct: function (data) { return { Ref: data }; } }),
  new yaml.Type('!Equals', { kind: 'sequence', construct: function (data) { return { 'Fn::Equals': data }; } }),
  new yaml.Type('!Not', { kind: 'sequence', construct: function (data) { return { 'Fn::Not': data }; } }),
  new yaml.Type('!Sub', { kind: 'scalar', construct: function (data) { return { 'Fn::Sub': data }; } }),
  new yaml.Type('!Sub', { kind: 'sequence', construct: function (data) { return { 'Fn::Sub': data }; } }),
  new yaml.Type('!If', { kind: 'sequence', construct: function (data) { return { 'Fn::If': data }; } }),
  new yaml.Type('!And', { kind: 'sequence', construct: function (data) { return { 'Fn::And': data }; } }),
  new yaml.Type('!Or', { kind: 'sequence', construct: function (data) { return { 'Fn::Or': data }; } }),
  new yaml.Type('!Join', { kind: 'sequence', construct: function (data) { return { 'Fn::Join': data }; } }),
  new yaml.Type('!Select', { kind: 'sequence', construct: function (data) { return { 'Fn::Select': data }; } }),
  new yaml.Type('!FindInMap', { kind: 'sequence', construct: function (data) { return { 'Fn::FindInMap': data }; } }),
  new yaml.Type('!GetAtt', { kind: 'scalar', construct: function (data) { return { 'Fn::GetAtt': [data.split('.', 1).pop(), data.replace(GETATT_RESOURCE_STRIP_RE, '')] }; } }),
  new yaml.Type('!GetAtt', { kind: 'sequence', construct: function (data) { return { 'Fn::GetAtt': data }; } }),
  new yaml.Type('!GetAZs', { kind: 'scalar', construct: function (data) { return { 'Fn::GetAZs': data || '' }; } }),
  new yaml.Type('!Base64', { kind: 'scalar', construct: function (data) { return { 'Fn::Base64': data }; } }),
  new yaml.Type('!Base64', { kind: 'mapping', construct: function (data) { return { 'Fn::Base64': data }; } }),
  new yaml.Type('!Cidr', { kind: 'sequence', construct: function (data) { return { 'Fn::Cidr': data }; } }),
  new yaml.Type('!ImportValue', { kind: 'scalar', construct: function (data) { return { 'Fn::ImportValue': data }; } }),
  new yaml.Type('!ImportValue', { kind: 'mapping', construct: function (data) { return { 'Fn::ImportValue': data }; } }),
  new yaml.Type('!Split', { kind: 'sequence', construct: function (data) { return { 'Fn::Split': data }; } }),
  new yaml.Type('!Condition', { kind: 'scalar', construct: function (data) { return { 'Condition': data }; } })
]);

async function retrieveLayer(){

  const template = yaml.safeLoad(fs.readFileSync('../../.stackery/template.yaml', 'utf8'), { schema: CF_SCHEMA });
  let stringTemplate = JSON.stringify(template);
  const { Resources, Parameters } = template;
  let newTemplate;

  for (resource in Resources) {
    if (Resources[resource].Properties && 'Layers' in Resources[resource].Properties) {
      for (layer of Resources[resource].Properties.Layers) {
        if (typeof layer === 'object' && layer.Ref in Parameters) {
          const param = Parameters[layer.Ref];
          if (param.Type === 'AWS::SSM::Parameter::Value<String>') {
            let cmdArgs = ['ssm', 'get-parameters', '--names', param.Default, '--with-decryption', '--region', info.region];
            if (info.awsProfile) {
              cmdArgs = cmdArgs.concat(['--profile', info.awsProfile]);
            }
            const test = execFileSync('aws', cmdArgs);
            newTemplate = stringTemplate.replace(
              JSON.stringify(layer),
              `"${JSON.parse(test).Parameters[0].Value}"`
            );
          }
        }
      }
    }
  }
  fs.writeFileSync('../../.stackery/template.yaml', yaml.dump(JSON.parse(newTemplate), { schema: CF_SCHEMA }));
}

retrieveLayer();