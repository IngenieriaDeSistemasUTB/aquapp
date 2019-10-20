import { Component, OnInit } from '@angular/core';
import { LinkGridElement } from 'src/app/utils/models/link-grid';
import { ROUTES } from 'src/app/routes';

@Component({
  selector: 'app-admin-start-page',
  templateUrl: './admin-start-page.component.html',
  styleUrls: ['./admin-start-page.component.scss'],
})
export class AdminStartPageComponent implements OnInit {
  shortcuts: LinkGridElement[] = [
    {
      title: 'Objetos',
      description: `Administración de objetos`,
      url: ['/', ROUTES.trackedObjects],
      queryParameters: {},
    },
    {
      title: 'Formularios',
      description: `Administración de formularios`,
      url: ['/', ROUTES.forms],
      queryParameters: {},
    },
  ];
  constructor() {}

  ngOnInit() {}
}
