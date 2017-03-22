import { AngularClusterGeneratorPage } from './app.po';

describe('angular-cluster-generator App', () => {
  let page: AngularClusterGeneratorPage;

  beforeEach(() => {
    page = new AngularClusterGeneratorPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
