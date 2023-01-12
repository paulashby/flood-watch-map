const mockItems = [
    {
        id: "http://environment.data.gov.uk/flood-monitoring/id/floods/063WAT23West",
        description: "Tidal Thames riverside from Putney Bridge to Teddington Weir",
        eaAreaName: "Kent, South London and East Sussex",
        eaRegioName: "No longer used",
        floodArea: {
            id: "http://environment.data.gov.uk/flood-monitoring/id/floodAreas/063WAT23West",
            county: "Greater London, Hammersmith and Fulham, Hounslow, Richmond upon Thames, Wandsworth",
            envelope: {
                lowerCorner: {
                    lx: 515955,
                    ly: 171213
                },
                upperCorner: {
                    ux: 524308.675621891,
                    uy: 178353.125870647
                }
            },
            notation: "063WAT23West",
            polygon: "http://environment.data.gov.uk/flood-monitoring/id/floodAreas/063WAT23West/polygon",
            riverOrSea: "River Thames"
        },
        floodAreaID: "063WAT23West",
        isToday: true,
        message: " ",
        severity: "Warning no longer in force",
        severityLevel: 4,
        timeMessageChanged: "2023-01-09T17:59:00",
        timeRaised: "2023-01-09T17:59:51",
        timeSeverityChanged: "2023-01-09T17:59:00"
    },
    {
        id: "http://environment.data.gov.uk/flood-monitoring/id/floods/064WAF32MdleMole",
        description: "River Mole and its tributaries from Kinnersley Manor to South Hersham",
        eaAreaName: "Kent, South London and East Sussex",
        eaRegioName: "No longer used",
        floodArea: {
            id: "http://environment.data.gov.uk/flood-monitoring/id/floodAreas/064WAF32MdleMole",
            county: "Surrey",
            envelope: {
                lowerCorner: {
                    lx: 508732,
                    ly: 140475
                },
                upperCorner: {
                    ux: 528677,
                    uy: 163335
                }
            },
            notation: "064WAF32MdleMole",
            polygon: "http://environment.data.gov.uk/flood-monitoring/id/floodAreas/064WAF32MdleMole/polygon",
            riverOrSea: "River Mole"
        },
        floodAreaID: "064WAF32MdleMole",
        isToday: false,
        message: "This Flood Alert has been removed.\n\nRiver levels have now fallen below the level expected to cause flooding. Further light rainfall is forecasted during the daytime today on 10 January 2023.\n\nWe will continue to monitor the situation and re-issue the alert if necessary.",
        severity: "Warning no longer in force",
        severityLevel: 4,
        timeMessageChanged: "2023-01-10T11:43:00",
        timeRaised: "2023-01-10T11:44:04",
        timeSeverityChanged: "2023-01-10T11:43:00"
    },
    {
        id: "http://environment.data.gov.uk/flood-monitoring/id/floods/062WAB36TidCrane",
        description: "Tidal River Crane",
        eaAreaName: "Hertfordshire and North London",
        eaRegioName: "No longer used",
        floodArea: {
            id: "http://environment.data.gov.uk/flood-monitoring/id/floodAreas/062WAB36TidCrane",
            county: "Greater London, Hounslow, Richmond upon Thames",
            envelope: {
                lowerCorner: {
                    lx: 516267,
                    ly: 174786
                },
                upperCorner: {
                    ux: 516680,
                    uy: 175475
                }
            },
            notation: "062WAB36TidCrane",
            polygon: "http://environment.data.gov.uk/flood-monitoring/id/floodAreas/062WAB36TidCrane/polygon",
            riverOrSea: "River Crane"
        },
        floodAreaID: "062WAB36TidCrane",
        isToday: false,
        message: "There is no longer a threat of flooding, though standing water and debris may still remain.\nThe forecast is dry for this evening.  Further heavy rainfall is expected on Tuesday 10 January.\nWe will continue to monitor levels closely.\nThere may still be some areas where flood water is present until it can naturally drain away.",
        severity: "Warning no longer in force",
        severityLevel: 4,
        timeMessageChanged: "2023-01-09T19:06:00",
        timeRaised: "2023-01-09T19:06:49",
        timeSeverityChanged: "2023-01-09T19:06:00"
    },
    {
        id: "http://environment.data.gov.uk/flood-monitoring/id/floods/061WAB23Trowlock",
        description: "River Thames at Trowlock Island",
        eaAreaName: "Thames",
        eaRegioName: "No longer used",
        floodArea: {
            id: "http://environment.data.gov.uk/flood-monitoring/id/floodAreas/061WAB23Trowlock",
            county: "Greater London, Richmond upon Thames",
            envelope: {
                lowerCorner: {
                    lx: 517407.45920398,
                    ly: 170767.537313433
                },
                upperCorner: {
                    ux: 517720.37761194,
                    uy: 171132.812437811
                }
            },
            notation: "061WAB23Trowlock",
            polygon: "http://environment.data.gov.uk/flood-monitoring/id/floodAreas/061WAB23Trowlock/polygon",
            riverOrSea: "River Thames"
        },
        floodAreaID: "061WAB23Trowlock",
        isToday: false,
        message: " Property flooding is not currently expected.\nRiver levels are rising slowly on the River Thames as a result of heavy rainfall. Therefore, flooding of low lying land is expected. The forecast this evening and overnight is mostly dry. The next high tide at 16:15 (09/01/23) is forecast to be approximately 5m - 5.2m. The following high tides tomorrow are not expected to result in flooding to low lying land and footpaths.  \nPlease remain safe and aware of your local surroundings and refer to the 'River and Sea levels in England's webpage for current river levels. ",
        severity: "Flood alert",
        severityLevel: 3,
        timeMessageChanged: "2023-01-09T13:05:00",
        timeRaised: "2023-01-09T13:06:06",
        timeSeverityChanged: "2023-01-09T13:05:00"
    },
    {
        id: "http://environment.data.gov.uk/flood-monitoring/id/floods/061WAF23Shepprtn",
        description: "River Thames from Shepperton to Molesey",
        eaAreaName: "Thames",
        eaRegioName: "No longer used",
        floodArea: {
            id: "http://environment.data.gov.uk/flood-monitoring/id/floodAreas/061WAF23Shepprtn",
            county: "Greater London, Richmond upon Thames, Surrey",
            envelope: {
                lowerCorner: {
                    lx: 506392,
                    ly: 165289
                },
                upperCorner: {
                    ux: 516066,
                    uy: 170802
                }
            },
            notation: "061WAF23Shepprtn",
            polygon: "http://environment.data.gov.uk/flood-monitoring/id/floodAreas/061WAF23Shepprtn/polygon",
            riverOrSea: "River Thames"
        },
        floodAreaID: "061WAF23Shepprtn",
        isToday: false,
        message: " Flooding is possible in this area. Monitor local water levels and weather conditions. Avoid using low lying footpaths or entering areas prone to flooding. Start acting on your flood plan if you have one. The Environment Agency Flood Warning System has issued this message based on rising river or tidal levels. We are temporarily automating our messages due to industrial action.",
        severity: "Flood alert",
        severityLevel: 3,
        timeMessageChanged: "2023-01-09T14:53:00",
        timeRaised: "2023-01-09T14:53:46",
        timeSeverityChanged: "2023-01-09T14:53:00"
    }
];