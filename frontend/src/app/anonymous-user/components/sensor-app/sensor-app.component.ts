import { Component, OnInit } from '@angular/core';
import { MessagesService } from 'src/app/utils/services/messages.service';
import { MESSAGES } from 'src/app/messages';
import { tileLayer, latLng, LatLngBounds, Map, Marker, DivIcon } from 'leaflet';
import { environment } from 'src/environments/environment';
import { ApiService } from 'src/app/utils/services/api.service';
import { JSONataResponse } from 'src/app/utils/models/url';
import { MarkerClusterLayer, Layer, MarkerLayer } from 'src/app/utils/models/layer';
import { MapService } from 'src/app/utils/services/map.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogDateTimeComponent } from '../dialog-date-time/dialog-date-time.component';
import { DialogByHoursComponent } from '../dialog-by-hours/dialog-by-hours.component';
declare let L;
import 'leaflet';
import 'leaflet.markercluster';
import { NoopScrollStrategy } from '@angular/cdk/overlay';

@Component({
  selector: 'app-sensor-app',
  templateUrl: './sensor-app.component.html',
  styleUrls: ['./sensor-app.component.scss'],
})
export class SensorAppComponent implements OnInit {
  mapStyle: any = {
    height: `${window.innerHeight - 64}px`,
    width: '100%',
  };
  mapOptions = {
    layers: [
      tileLayer(environment.mapUrl, {
        maxZoom: 18,
        attribution: 'Map data © OpenStreetMap contributors',
      }),
    ],
    zoom: 13.5,
    center: latLng(10.4241961, -75.535),
  };
  mapBounds = new LatLngBounds(latLng(10.371076, -75.466699), latLng(10.369281, -75.463776));
  map: Map;
  form = '5dc341823153fa33d0225b11';
  routes: any[];
  routesIds: string[] = [];
  points: any;
  layers: Layer[] = [];
  constructor(
    private messageService: MessagesService,
    private apiService: ApiService,
    private mapService: MapService,
    public dialog: MatDialog,
  ) { }

  ngOnInit() {
    this.messageService.sendMessage({ name: MESSAGES.closeSidenav, value: {} });
    this.messageService.sendMessage({
      name: MESSAGES.fullWidthContent,
      value: {},
    });
  }

  async init() {
    let rightNow = new Date();
    let todayDate = new Date(
      rightNow.getFullYear(),
      rightNow.getMonth(),
      rightNow.getDate(),
      0, 0, 0, 0
    );
    let TenMinAgo = new Date(rightNow.getFullYear(),
      rightNow.getMonth(),
      rightNow.getDate(),
      rightNow.getHours(),
      rightNow.getMinutes() - 10,
      rightNow.getSeconds(),
      rightNow.getMilliseconds())
    await this.apiService
      .get('/elements/open/jsonata', {
        query: `([$[form="${this.form}"]])`,
      })
      .toPromise()
      .then((routes: JSONataResponse) => {
        this.routes = routes.data;
      });
    //console.log(this.routes);
    let routeIds = []
    for (const route of this.routes) {
      routeIds.push(route.id);
    }
    this.routesIds = routeIds;
    this.points = await this.apiService
      .get('/data/open/vm2', {
        query: `this.data`,
        additionalFilters: JSON.stringify([
          {
            trackedObject: {
              inq: this.routesIds,
            },
          },
          { createdAt: { gte: +TenMinAgo } },
          { createdAt: { lte: +rightNow } },
        ]),
      })
      .toPromise();
    this.setupLayers();
  }

  setupLayers() {
    const markerStyle = `
            text-shadow: 2px 0 0 #333,
              -2px 0 0 #333, 0 2px 0 #333,
              0 -2px 0 #333, 1px 1px #333,
              -1px -1px 0 #333,
              1px -1px 0 #333,
              -1px 1px 0 #333;
            color: #3f51b5;
            font-size: 32pt;
          `;

    //console.log(route.data);
    this.layers.push(
      new MarkerLayer(
        'Posiciones',
        '',
        {},
        true,
        false,
        (this.points || []).filter(
          (d) => d.latitude !== null && d.latitude !== undefined && d.longitude !== null && d.longitude !== undefined,
        )
          .map((d) => new Marker([d.latitude, d.longitude],
            {
              icon: new DivIcon({
                className: 'marker',
                html: `
              <i
                class="fas fa-map-marker-alt"
                style="${markerStyle}"
              >
              </i>
              `,
                iconSize: [32, 32],
                iconAnchor: [12, 36],
              }),
            })),
      )
    );

    this.updateLayers();
  }

  updateLayers() {
    for (const layer of this.layers) {
      if (layer.active && !layer.loaded) {
        this.mapService.addLayer(layer, this.map);
      } else if (!layer.active && layer.loaded) {
        this.mapService.removeLayer(layer, this.map);
      }
    }
  }

  onMapReady(map: Map) {
    this.map = map;
    window.addEventListener('resize', () => this.fixMap());
    setTimeout(() => {
      this.init();
      this.fixMap();
      /*this.messageService.sendMessage({
        name: MESSAGES.showSplashScreen,
        value: {},
      });*/
    }, 300);
  }

  fixMap() {
    this.mapStyle =
      this.mapStyle === undefined
        ? {
          height: `${window.innerHeight - 64}px`,
          width: '100%',
        }
        : this.mapStyle;
    this.map.invalidateSize();
    if (this.mapBounds) {
      this.map.fitBounds(this.mapBounds);
    }
  }

  openDialogDateTime() {
    const dialogRef = this.dialog.open(DialogDateTimeComponent, {
      width: '60%',
      data: {},
      scrollStrategy: new NoopScrollStrategy(),
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      //console.log(result);
      const dialogRef2 = this.dialog.open(DialogByHoursComponent, {
        width: '60%',
        data: result,
        scrollStrategy: new NoopScrollStrategy(),
      });
      dialogRef2.afterClosed().subscribe(async (result) => {
        if (result) {
          this.points = await this.apiService
            .get('/data/open/vm2', {
              query: `this.data`,
              additionalFilters: JSON.stringify([
                {
                  trackedObject: {
                    inq: this.routesIds,
                  },
                },
                { createdAt: { gte: +result.startDateHour } },
                { createdAt: { lte: +result.endDateHour } },
              ]),
            })
            .toPromise();
          for (const layer of this.layers) {
            layer.active = false;
          }
          this.updateLayers();
          this.layers = [];
          this.setupLayers();
        }
      });
    });
  }
}
