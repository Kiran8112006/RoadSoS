    import * as FileSystem
    from 'expo-file-system/legacy';

    import * as Sharing
    from 'expo-sharing';

    const rawApiUrl =
    process.env.EXPO_PUBLIC_API_URL || '';

    const API_BASE_URL =
    rawApiUrl
        .replace(/\/+$/, '')
        .replace(/\/api$/, '');

    export const
    downloadMedicalReport =
    async (
    userId: string
    ) => {

    try {

        console.log(
        'DOWNLOADING PDF FOR:',
        userId
        );

        const pdfUrl =
        `${API_BASE_URL}/api/pdf/medical-report/${userId}`;

        console.log(
        'PDF URL:',
        pdfUrl
        );

        const fileUri =
        FileSystem.documentDirectory! +
        'RoadSoS_Report.pdf';

        const result =
        await FileSystem.downloadAsync(
            pdfUrl,
            fileUri
        );

        console.log(
        'PDF SAVED:',
        result.uri
        );

        await Sharing.shareAsync(
        result.uri
        );

    }

    catch(error) {

        console.log(
        'PDF ERROR:',
        error
        );

    }

    };
