export const toc = {
  "2025-12-05": {
    "path": "2025-12-05.md",
    "title": "2025-12-05",
    "__hasExtension": false
  },
  "cody": {
    "path": "Cody.md",
    "title": "Cody",
    "__hasExtension": false
  },
  "documentation": {
    "configuration": {
      "path": "Documentation/Configuration.md",
      "title": "Configuration",
      "__hasExtension": false
    },
    "linux": {
      "path": "Documentation/Linux.md",
      "title": "Linux",
      "__hasExtension": false
    },
    "_meta": {
      "__originalName": "Documentation"
    }
  },
  "index": {
    "path": "index.md",
    "title": "Stack Documentation",
    "__hasExtension": false
  },
  "languages": {
    "rust": {
      "error-handling": {
        "path": "Languages/Rust/Error Handling.md",
        "title": "Rust Error Handling",
        "__hasExtension": false,
        "description": "An example of rust error handling using a custom method."
      },
      "_meta": {
        "__originalName": "Rust"
      }
    },
    "_meta": {
      "__originalName": "Languages"
    }
  },
  "music": {
    "albums": {
      "deftones-saturday-night-wrist": {
        "path": "Music/albums/Deftones - Saturday Night Wrist.md",
        "title": "Saturday Night Wrist",
        "__hasExtension": false,
        "artist": "Deftones",
        "release_date": 2005,
        "musicbrainz_id": "82be2ea8-9c50-3024-a1be-cf35c2e5fd69",
        "primary_type": "Album",
        "rating": 4,
        "nostalgia_rating": 5,
        "track_scores": 0.66,
        "package_score": 5,
        "image": "[[snw.jpg]]"
      },
      "dir-en-grey-dum-spiro-spero": {
        "path": "Music/albums/DIR EN GREY - DUM SPIRO SPERO.md",
        "title": "Dum Spiro Spero",
        "__hasExtension": false,
        "artist": "DIR EN GREY",
        "release_date": "2011-07-31",
        "musicbrainz_id": "4ead1ec8-65fd-4d44-b2c3-a8e1bdf5467a",
        "image": "[[dum-spiro-spero.jpg]]",
        "primary_type": "Album",
        "rating": 5,
        "nostalgia_rating": 5,
        "track_scores": 0.95,
        "package_score": 5
      },
      "dir-en-grey-uroboros": {
        "path": "Music/albums/DIR EN GREY - UROBOROS.md",
        "title": "UROBOROS",
        "__hasExtension": false,
        "artist": "DIR EN GREY",
        "release_date": "2008-11-10",
        "musicbrainz_id": "f3a260b7-669f-3f0c-a8d6-21886fade241",
        "primary_type": "Album",
        "rating": 5,
        "nostalgia_rating": 5,
        "track_scores": 0.91,
        "package_score": 5,
        "image": "[[uroboros.jpg]]"
      },
      "foxing-foxing": {
        "path": "Music/albums/Foxing - Foxing.md",
        "title": "Foxing",
        "__hasExtension": false,
        "artist": "Foxing",
        "release_date": "2024-09-12",
        "musicbrainz_id": "e6c562a8-b3ae-4a25-942a-2e35f8137a5e",
        "primary_type": "Album",
        "rating": 4.5,
        "nostalgia_rating": 5,
        "track_scores": 0.7,
        "package_score": 5,
        "image": "[[foxing.jpg]]"
      },
      "interpol-turn-on-the-bright-lights": {
        "path": "Music/albums/Interpol - Turn On the Bright Lights.md",
        "title": "Turn On the Bright Lights",
        "__hasExtension": false,
        "artist": "Interpol",
        "release_date": "2002-08-18",
        "musicbrainz_id": "e7227840-5ef2-3813-af26-15dab34e1a51",
        "primary_type": "Album",
        "rating": 4,
        "nostalgia_rating": 3,
        "track_scores": 0.75,
        "package_score": 3,
        "image": "[[totbl.jpg]]"
      },
      "kendrick-lamar-damn": {
        "path": "Music/albums/Kendrick Lamar - DAMN..md",
        "title": "DAMN.",
        "__hasExtension": false,
        "artist": "Kendrick Lamar",
        "release_date": "2017-04-13",
        "musicbrainz_id": "b88655ba-7469-48b8-a296-b9011ab73ef3",
        "primary_type": "Album",
        "rating": -1,
        "nostalgia_rating": 4,
        "track_scores": 0.8,
        "package_score": 4,
        "image": "[[damn.jpg]]"
      },
      "_meta": {
        "__originalName": "albums"
      }
    },
    "some-great-albums": {
      "path": "Music/Some Great Albums.base",
      "title": "Some Great Albums",
      "__hasExtension": false,
      "icon": "database",
      "views": [
        {
          "type": "cards",
          "name": "Albums",
          "filters": {
            "and": [
              "file.path.startsWith(\"Music\")",
              "!image.isEmpty()"
            ]
          },
          "order": [
            "file.name",
            "artist",
            "title",
            "track_scores",
            "rating",
            "release_date"
          ],
          "image": "image"
        },
        {
          "type": "table",
          "name": "Sorted",
          "order": [
            "artist",
            "title",
            "release_date",
            "track_scores",
            "package_score",
            "nostalgia_rating",
            "rating",
            "album"
          ],
          "sort": [
            {
              "property": "rating",
              "direction": "ASC"
            },
            {
              "property": "artist",
              "direction": "DESC"
            },
            {
              "property": "title",
              "direction": "DESC"
            }
          ],
          "columnSize": {
            "note.artist": 125,
            "note.title": 211
          }
        }
      ]
    },
    "_meta": {
      "__originalName": "Music"
    }
  },
  "rust": {
    "error-handling": {
      "path": "Rust/Error Handling.md",
      "title": "Error Handling",
      "__hasExtension": false
    },
    "moc": {
      "path": "Rust/MOC.md",
      "title": "MOC",
      "__hasExtension": false
    },
    "_meta": {
      "__originalName": "Rust"
    }
  },
  "stack": {
    "rust": {
      "rust-backend-moc": {
        "path": "Stack/Rust/Rust Backend MOC.md",
        "title": "Rust Backend MOC",
        "__hasExtension": false
      },
      "seaorm": {
        "seaorm-moc": {
          "path": "Stack/Rust/SeaORM/SeaORM MOC.md",
          "title": "SeaORM MOC",
          "__hasExtension": false
        },
        "_meta": {
          "__originalName": "SeaORM"
        }
      },
      "_meta": {
        "__originalName": "Rust"
      }
    },
    "sveltekit": {
      "sveltekit-moc": {
        "path": "Stack/SvelteKit/Sveltekit MOC.md",
        "title": "Sveltekit MOC",
        "__hasExtension": false
      },
      "_meta": {
        "__originalName": "SvelteKit"
      }
    },
    "tauri": {
      "tauri-moc": {
        "path": "Stack/Tauri/Tauri MOC.md",
        "title": "Tauri MOC",
        "__hasExtension": false
      },
      "_meta": {
        "__originalName": "Tauri"
      }
    },
    "_meta": {
      "__originalName": "Stack"
    }
  }
};
