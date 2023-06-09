import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ModuleSummary } from '@app/shared/interfaces/module.interface';
import { ModulesService } from '../../services/modules-service/modules.service';
import { AppConfigService } from '@app/core/services/app-config/app-config.service';
import { Observable, Subject, combineLatest, distinct, forkJoin, groupBy, map, mergeAll, mergeMap, toArray } from 'rxjs';

@Component({
  selector: 'app-modules-list',
  templateUrl: './modules-list.component.html',
  styleUrls: ['./modules-list.component.scss']
})
export class ModulesListComponent implements OnInit {

  constructor(
    private fb: FormBuilder,
    private modulesService: ModulesService,
    private appConfigService: AppConfigService
  ) { }

  searchFormGroup!: FormGroup;
  isLoading: boolean = false;

  modules: ModuleSummary[] = []

  moduleType: "development" | "model" = "model"

  initializeForm() {
    this.searchFormGroup = this.fb.group({
      search: ''
    })
  }

  /**
   * Function that retrieves a list of modules
   * If tags are defined in the config file of the project it makes a request for every tag object
   *
   * @memberof ModulesListComponent
   */
  getModulesSummaryFromService() {
    this.isLoading = true;

    if (this.appConfigService.tags) {
      let tags = this.appConfigService.tags
      let observableList: Observable<ModuleSummary[]>[] = []
      tags.forEach((tag: any) => {
        observableList.push(this.modulesService.getModulesSummary(tag))
      });

      const observableResult = forkJoin(observableList)
      observableResult.subscribe({
        next: modules => {
          this.isLoading = false;
          let jointModulesArray = ([] as ModuleSummary[]).concat(...modules)
          // Delete possible duplicates from array based on name
          this.modules = jointModulesArray.filter((v, i, a) => a.findIndex(v2 => (v2.name === v.name)) === i)
        },
        error: () => {
          setTimeout(() =>
            this.isLoading = false
            , 3000);
        }
      });
    } else {
      this.modulesService.getModulesSummary().subscribe({
        next: modules => {
          this.isLoading = false;
          this.modules = modules;
        },
        error: () => {
          setTimeout(() =>
            this.isLoading = false
            , 3000);
        }
      }
      )
    }
  }

  ngOnInit(): void {
    this.initializeForm();
    this.getModulesSummaryFromService();
  }


}
