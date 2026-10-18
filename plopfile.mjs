export default function (plop) {
  plop.setGenerator('lib', {
    description: 'Bootstrap TypeScript Library Baru',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Nama library (misal: logger, auth):'
      }
    ],
    actions: [
      {
        type: 'add',
        path: 'libs/{{dashCase name}}/package.json',
        templateFile: 'templates/lib/package.json.hbs'
      },
      {
        type: 'add',
        path: 'libs/{{dashCase name}}/tsconfig.json',
        templateFile: 'templates/lib/tsconfig.json.hbs'
      },
      {
        type: 'add',
        path: 'libs/{{dashCase name}}/src/index.ts',
        templateFile: 'templates/lib/index.ts.hbs'
      }
    ]
  });
}
