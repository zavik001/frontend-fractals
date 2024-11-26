let currentImageUrl = null;
let analysisChart = null;

if (document.getElementById('fractalForm')) {
    document.getElementById('fractalForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = {
            width: +document.getElementById('width').value,
            height: +document.getElementById('height').value,
            iterations: +document.getElementById('iterations').value,
            symmetry: +document.getElementById('symmetry').value,
            gamma: +document.getElementById('gamma').value,
            generatorType: document.getElementById('generatorType').value,
            transformationType: document.getElementById('transformationType').value,
            imageType: document.getElementById('imageType').value,
        };

        try {
            const response = await fetch('http://localhost:8080/api/fractals/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error generating fractal:', errorText);
                alert('Error generating fractal. Please try again.');
                return;
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const fractalImage = document.getElementById('fractalImage');
            fractalImage.src = url;
            fractalImage.style.display = 'block';

            const downloadLink = document.getElementById('downloadLink');
            downloadLink.href = url;
            downloadLink.download = `fractal.${formData.imageType.toLowerCase()}`;
            downloadLink.style.display = 'block';
        } catch (error) {
            console.error('Error:', error);
            alert('An unexpected error occurred. Please check the console for details.');
        }
    });
}


if (document.getElementById('analyzeButton')) {
    document.getElementById('analyzeButton').addEventListener('click', async () => {
        const canvas = document.getElementById('analysisChart');
        const ctx = canvas.getContext('2d');

        if (window.analysisChart instanceof Chart) {
            window.analysisChart.destroy();
        }

        const delayTime = 1500;

        try {
            const multiData = await fetchWithDelay('http://localhost:8080/api/analysis/multi', delayTime);
            const singleData = await fetchWithDelay('http://localhost:8080/api/analysis/single', delayTime);

            if (!multiData || !singleData) {
                throw new Error('No data available for chart generation.');
            }

            const multiThreadedPoints = multiData.map(point => ({ x: point.iterations, y: point.timeTaken }));
            const singleThreadedPoints = singleData.map(point => ({ x: point.iterations, y: point.timeTaken }));

            window.analysisChart = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [
                        {
                            label: 'Multi-Threaded',
                            data: multiThreadedPoints.sort((a, b) => a.x - b.x),
                            borderColor: 'blue',
                            borderWidth: 2,
                            fill: false,
                            tension: 0.3,
                            pointRadius: 3,
                        },
                        {
                            label: 'Single-Threaded',
                            data: singleThreadedPoints.sort((a, b) => a.x - b.x),
                            borderColor: 'orange',
                            borderWidth: 2,
                            fill: false,
                            tension: 0.3,
                            pointRadius: 3,
                        },
                    ],
                },
                options: {
                    scales: {
                        x: {
                            type: 'linear',
                            title: {
                                display: true,
                                text: 'Iterations',
                            },
                            ticks: {
                                callback: (value) => value.toLocaleString(),
                            },
                        },
                        y: {
                            type: 'logarithmic',
                            title: {
                                display: true,
                                text: 'Time Taken (ms)',
                            },
                            min: 1,
                            ticks: {
                                callback: (value) => value.toLocaleString(),
                            },
                        },
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const { x, y } = context.raw;
                                    return `Iterations: ${x}, Time: ${y} ms`;
                                },
                            },
                        },
                    },
                },
            });
        } catch (error) {
            console.error('Error generating chart:', error);
            alert('Error generating chart. Check the console for details.');
        }
    });
}

async function fetchWithDelay(url, delay) {
    console.log(`Sending request to ${url} in ${delay} ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Request failed for ${url}: ${response.status} (${response.statusText})`);
        }
        return response.json();
    } catch (error) {
        console.error(`Fetch error for ${url}:`, error);
        throw error;
    }
}
