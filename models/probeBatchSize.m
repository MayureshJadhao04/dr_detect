load('D:\DATASETS\combined\channelPosWeights.mat')  % provides posWeights

gpuDevice

candidateBatchSizes = [4 8 12 16 24 32];
for bs = candidateBatchSizes
    try
        dummyX = dlarray(rand(256,256,3,bs,'single','gpuArray'), 'SSCB');
        dummyT = cat(3, false(256,256,4,bs), true(256,256,4,bs));
        dummyT = dlarray(single(dummyT), 'SSCB');

        [loss, grads] = dlfeval(@modelLossFcn, net, dummyX, dummyT, posWeights);
        fprintf('BatchSize %d OK\n', bs);
    catch ME
        fprintf('BatchSize %d FAILED: %s\n', bs, ME.message);
    end
    clear dummyX dummyT loss grads
    reset(gpuDevice);
end

function [loss, grads] = modelLossFcn(net, X, T, posWeights)
Y = forward(net, X);
loss = maskedWeightedBCELoss(Y, T, posWeights, 1.0);
grads = dlgradient(loss, net.Learnables);
end