import { Component, OnInit, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { constructHoleFromGroup, setHoleFormValue } from '../form.data';
import { APIService } from '../../../services/api.service';
import { newFormData } from '../../../utils/form/constructor-FormData';
import { AppService } from '../../app.service';

@Component({
  selector: 'app-group-task-data',
  templateUrl: './group-task-data.component.html',
  styleUrls: ['./group-task-data.component.less']
})
export class GroupTaskDataComponent implements OnInit {
  @Input()
  nowDevice: any;

  nowTaskDataArr = [];
  nowTaskData: any;
  holeFormGroup: FormGroup;
  holeFormTypes: any;
  holeSubscribe: any;
  holeGroupId = null;
  countKM: any;
  modeStrArr: any;
  holeGroupEdit = false;

  constructor(
    private _service: APIService,
    private _appService: AppService
  ) { }

  ngOnInit() {
    const holeForm = constructHoleFromGroup();
    this.holeFormGroup = holeForm.formGroup;
    this.holeFormTypes = holeForm.formTypes;
    // this.holeFormGroup.disable(); // 输入框禁止编辑状态
  }

  constructHoleFormGroup(holeGroups) {
    this.nowTaskDataArr = [];
    const taskBase = {
      name: null,
      mode: null,
      tensionKn: 0,
      tensionLength: null,
      steelStrandNumber: null,
      tensionStage: '4',
      twice: false,
      super: false,
      'tensionStageValue[0]': 10,
      'tensionStageValue[1]': 20,
      'tensionStageValue[2]': 50,
      'tensionStageValue[3]': 100,
      'time[0]': 30,
      'time[1]': 30,
      'time[2]': 30,
      'time[3]': 300,
      // superTensionStageValue: 110,
    };
    const modeBase = {
      workMm: null,
      retractionMm: null,
      theoryMm: null,
    };
    const mode = [['a1'], ['a1', 'a2'], ['b1'], ['b1', 'b2'], ['a1', 'a2', 'b1', 'b2']];
    holeGroups.forEach((item, index) => {
      const groupItem = Object.assign({}, taskBase);
      groupItem.name = item.hole;
      groupItem.mode = item.mode;
      // groupItem.tensionKn = 0;
      mode[item.mode].forEach(m => {
        groupItem[`${m}.workMm`] = 0;
        groupItem[`${m}.retractionMm`] = 0;
        groupItem[`${m}.theoryMm`] = 0;
      });
      this.nowTaskDataArr.push(groupItem);
    });
    console.log(this.holeFormGroup, this.holeFormTypes, this.nowTaskDataArr);
  }

  onSelectHoleRadio(id, state = false) {
    console.log(id);
    if (id !== this.holeGroupId || state) {
      this._service.get(`/holeGroup/${id}`).subscribe(r => {
        this.setFormValue(r);
        this.holeGroupId = id;
      });
    }
    // this.holeGroupId = index;
  }
  setFormValue(r) {
    const data = {};
    console.log(r);
    // tslint:disable-next-line:forin
    for (const key in r) {
      switch (key) {
        case 'tensionStageValue':
        case 'time':
          try {
            r[key].forEach((value, index) => {
              data[`${key}[${index}]`] = value;
            });
          } catch (error) {
          }
          break;
        case 'a1':
        case 'a2':
        case 'b1':
        case 'b2':
          // tslint:disable-next-line:forin
          for (const k in r[key]) {
            data[`${key}.${k}`] = r[key][k];
          }
          break;
        default:
          data[key] = r[key];
          break;
      }
    }
    console.log(r, data);
    this.nowTaskData = data;
    if (this.holeSubscribe) {
      this.holeSubscribe.unsubscribe();
    }
    setHoleFormValue(this.nowTaskData, this.holeFormGroup);
    this.onHoleSubscribe();
    this.funcModeStrArr();
    this.funcCountKM();
  }
  onHoleSubscribe() {
    this.holeSubscribe = this.holeFormGroup.valueChanges.subscribe((r) => {
      this.holeGroupEdit = true;
      this._appService.editState = true;
      if (this.holeGroupId !== null) {
        const data = this.nowTaskData;
        const formGroupValue = this.holeFormGroup.controls;
        console.log(data);
        // tslint:disable-next-line:forin
        for (const key in data) {
          switch (key) {
            case 'tensionStage':
            case 'super':
            case 'twice':
              if (data[key] !== formGroupValue[key].value) {
                this.holeSubscribe.unsubscribe();
                if (key === 'tensionStage') {
                  this.setTensionStage(data, formGroupValue[key].value);
                } else if (key === 'super') {
                  data[key] = formGroupValue[key].value;
                  if (!formGroupValue[key].value) {
                    delete data[`tensionStageValue[${data.tensionStage}]`];
                    delete data[`time[${data.tensionStage}]`];
                  } else {
                    this.setTensionStage(data, data.tensionStage);
                  }
                } else if (key === 'twice') {
                  data[key] = formGroupValue[key].value;
                  if (formGroupValue[key].value) {
                    this.setTensionStage(data, '4');
                  }
                }
                setHoleFormValue(this.nowTaskData, this.holeFormGroup);
                this.onHoleSubscribe();
                this.funcCountKM();
              }
              break;
            default:
              if (key in formGroupValue) {
                data[key] = formGroupValue[key].value;
              }
              break;
          }
        }
      }
      console.log(this.nowTaskData);
    });
  }
  setTensionStage(data, value) {
    delete data['tensionStageValue[3]'];
    delete data['tensionStageValue[4]'];
    delete data['tensionStageValue[5]'];
    delete data['time[3]'];
    delete data['time[4]'];
    delete data['time[5]'];
    const stage = [[], [], [], [10, 20, 100], [10, 20, 50, 100], [10, 20, 50, 80, 100]];
    const time = [[], [], [], [30, 30, 300], [30, 30, 30, 300], [30, 30, 30, 30, 300]];
    data.tensionStage = value;
    const timeValue = time[data.tensionStage];
    stage[data.tensionStage].forEach((item, index) => {
      data[`tensionStageValue[${index}]`] = item;
      data[`time[${index}]`] = timeValue[index];
    });
    if (data.super) {
      data[`tensionStageValue[${data.tensionStage}]`] = 110;
      data[`time[${data.tensionStage}]`] = 300;
      console.log('444444444444');
    }
  }
  funcModeStrArr() {
    const data = this.nowTaskData.mode;
    const mode = [['a1'], ['a1', 'a2'], ['b1'], ['b1', 'b2'], ['a1', 'a2', 'b1', 'b2']];
    this.modeStrArr = mode[data];
  }
  tensionStageArr() {
    let data = this.nowTaskData.tensionStage;
    if (this.nowTaskData.super) {
      data = Number(data) + 1;
    }
    const r = Array.from(new Array(Number(data)), (v, i) => i);
    return r;
  }
  funcCountKM() {
    const data = this.nowTaskData;
    const device = this.nowDevice;
    const tensionKn = data.tensionKn;
    const kns = [];
    const mpa = {
      a1: [],
      a2: [],
      b1: [],
      b2: [],
    };
    let tensionStage = data.tensionStage;
    if (data.super) {
      tensionStage = Number(tensionStage) + 1;
    }
    //     a1.calibrate.a : 1 bEquation
    // a1.calibrate.b : 1
    for (let index = 0; index < tensionStage; index++) {
      const kn = (data[`tensionStageValue[${index}]`] * tensionKn / 100).toFixed(2);
      kns.push(kn);
      this.modeStrArr.map(mode => {
        console.log('2222', mode, kn, device[mode].calibrate.a);
        const a = device[mode].calibrate.a;
        const b = device[mode].calibrate.b;
        // console.log(a, b, kn, Number(kn), device.bEquation);
        if (device.bEquation) {
          // Mpa = a * Kn + b;
          mpa[mode].push((a * Number(kn) + b).toFixed(2));
        } else {
          // Kn = a * Mpa + b;
          mpa[mode].push(((Number(kn) - b) / a).toFixed(2));
        }
      });
    }
    console.log(kns, mpa);
    this.countKM = { kn: kns, mpa: mpa };
  }
  funcV1() {
    this.holeFormGroup.controls['tensionStageValue[1]'].setValue(this.holeFormGroup.controls['tensionStageValue[0]'].value * 2);
    this.funcCountKM();
  }
  save() {
    console.log('保存');
    const fd = newFormData(this.nowTaskData);
    const http = 'put';
    const url = `/HoleGroup/${this.nowTaskData.id}`;
    this._service.http(http, fd, url, { success: '张拉组修改', error: '' }).subscribe(r => {
      console.log(r);
      if (r.state) {
        this.holeGroupEdit = false;
        this._appService.editState = false;
      }
    });
  }
  cancel() {
    console.log('取消');
    this.onSelectHoleRadio(this.holeGroupId, true);
    this.holeGroupEdit = false;
    this._appService.editState = false;
  }
}
