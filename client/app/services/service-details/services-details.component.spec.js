describe('Component: ServiceDetails', function() {

  beforeEach(function() {
    module('app.core', 'app.states', 'app.services');
  });

  describe('view', function() {
    let scope;
    let isoScope;
    let element;
    let ctrl;
    let collectionsApiSpy;


    beforeEach(inject(function($compile, $rootScope, $httpBackend, CollectionsApi, RBAC) {
      let mockDir = 'tests/mock/services/';
      const options = {
        attributes: [
          'name', 'guid', 'created_at', 'type', 'description', 'picture', 'picture.image_href', 'evm_owner.name', 'evm_owner.userid',
          'miq_group.description', 'all_service_children', 'aggregate_all_vm_cpus', 'aggregate_all_vm_memory', 'aggregate_all_vm_disk_count',
          'aggregate_all_vm_disk_space_allocated', 'aggregate_all_vm_disk_space_used', 'aggregate_all_vm_memory_on_disk', 'retired',
          'retirement_state', 'retirement_warn', 'retires_on', 'actions', 'custom_actions', 'provision_dialog', 'service_resources',
          'chargeback_report', 'service_template', 'parent_service', 'power_state', 'power_status', 'options',
        ],
        decorators: [
          'vms.ipaddresses',
          'vms.snapshots',
          'vms.v_total_snapshots',
          'vms.v_snapshot_newest_name',
          'vms.v_snapshot_newest_timestamp',
          'vms.v_snapshot_newest_total_size',
          'vms.supports_console?',
          'vms.supports_cockpit?'],
        expand: 'vms',
      };

      RBAC.setActionFeatures ({
        serviceDelete: {show: true},
        serviceRetireNow: {show: true},
        serviceRetire: {show: true},
        serviceTag: {show: true},
        serviceEdit: {show: true},
        serviceReconfigure: {show: true},
        serviceOwnership: {show: true},
      });

      const tagOptions = {
        expand: 'resources',
        attributes: ['categorization', 'category'],
      };

      scope = $rootScope.$new();
      $httpBackend.whenGET('').respond(200);

      scope.service = readJSON(mockDir + 'service1.json');
      scope.tags = readJSON(mockDir + 'service1_tags.json');

      collectionsApiSpy = sinon.stub(CollectionsApi, 'get');
      collectionsApiSpy.withArgs('services', 10000000000542, options).returns(Promise.resolve(scope.service));
      collectionsApiSpy.withArgs('services/10000000000542/tags/', tagOptions).returns(Promise.resolve(scope.tags));

      element = angular.element('<service-details service-id="10000000000542"></service-details>');
      let el = $compile(element)(scope);
      scope.$digest();
      isoScope = el.isolateScope();
      isoScope.vm.loading = false;
      isoScope.vm.service = scope.service;
      isoScope.$digest();
    }));

    it('should show the correct properties', function() {
      isoScope.vm.availableTags = scope.tags;
      isoScope.$digest();

      const readonlyInputs = element.find('.form-control');
      expect(readonlyInputs[1].value).to.eq('RHEL7 on VMware');
      expect(readonlyInputs[2].value).to.eq('8e892478-addd-11e6-9f30-005056b15629');
      expect(readonlyInputs[3].value).to.eq('10000000000542');
      expect(readonlyInputs[4].value).to.eq('Administrator');
      expect(readonlyInputs[5].value).to.eq('$');
      expect(readonlyInputs[6].value).to.eq('Nov 18, 2016 12:00:00 AM');
      expect(readonlyInputs[7].value).to.eq('Unknown');
      expect(readonlyInputs[8].value).to.eq('Oct 21, 2017');

      const tagsControl = element.find('.ss-form-readonly .service-details-tag-control');
      expect(tagsControl.length).to.eq(1);

      const tags = angular.element(tagsControl[0]).find('.label-info');
      expect(tags.length).to.eq(2);
      expect(tags[0].innerHTML.indexOf("Environment: Development")).to.not.eq(-1);
      expect(tags[1].innerHTML.indexOf("Workload: app")).to.not.eq(-1);
    });

    it('should have show the correct resources', function() {
      isoScope.vm.computeGroup = isoScope.vm.createResourceGroups(isoScope.vm.service);
      isoScope.$digest();

      const resourceTitles = element.find('.service-details-resource-group-title');
      expect(resourceTitles.length).to.eq(1);
      expect(resourceTitles[0].innerHTML).to.eq(" Compute (1) ");

      const resourceItems = element.find('.service-details-resource-list-container .list-group-item');
      expect(resourceItems.length).to.eq(1);

      const powerIcon = angular.element(resourceItems[0]).find('.pficon.pficon-ok');
      expect(powerIcon.length).to.eq(1);

      const typeIcon = angular.element(resourceItems[0]).find('.pficon.pficon-screen');
      expect(typeIcon.length).to.eq(1);

      const name = angular.element(resourceItems[0]).find('.name-column > span > a > span');
      expect(name.length).to.eq(1);
      expect(name[0].innerHTML).to.eq(" demo-iot-2 ");
    });

    it('should have show the correct relationships', function() {
      const relationshipsPanel = element.find('.relationships-panel');
      expect(relationshipsPanel.length).to.eq(1);

      const rows = angular.element(relationshipsPanel[0]).find('.row');
      expect(rows.length).to.eq(1);

      const columns = angular.element(rows[0]).find('.col-sm-4');
      expect(columns.length).to.eq(3);

      const relationShipName = angular.element(columns[0]).find('a');
      expect(relationShipName[0].innerHTML).to.eq('RHEL7 on VMware');

      expect(columns[1].innerHTML).to.eq('Parent Catalog Item');

      const description = angular.element(columns[2]).find('span');
      expect(description[0].innerHTML).to.eq('RHEL7 on VMware');
    });

    xit('should allow approprate actions', function() {
      isoScope.vm.hasCustomButtons(isoScope.vm.service);
      isoScope.$digest();

      const actionsPanel = element.find('.ss-details-header__actions');
      expect(actionsPanel.length).to.eq(1);

      const actionButtons = angular.element(actionsPanel[0]).find('.custom-dropdown');
      expect(actionButtons.length).to.eq(4);

      const powerButtons = angular.element(actionButtons[0]).find('.dropdown-menu > li');
      expect(powerButtons.length).to.eq(3);

      const startButton = angular.element(powerButtons[0]);
      const stopButton = angular.element(powerButtons[1]);
      const suspendButton = angular.element(powerButtons[2]);

      expect(startButton.hasClass('disabled')).to.eq(false);
      expect(stopButton.hasClass('disabled')).to.eq(true);
      expect(suspendButton.hasClass('disabled')).to.eq(true);
    });
  });
});
